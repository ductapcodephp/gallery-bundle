<?php

namespace AmzsCMS\GalleryBundle\Entity;

use AmzsCMS\CoreBundle\Traits\Doctrine\Timestampable;
use AmzsCMS\GalleryBundle\Traits\DoctrineDescriptionTrait;
use AmzsCMS\GalleryBundle\Traits\DoctrineIdentifierTrait;
use AmzsCMS\GalleryBundle\Traits\DoctrinePropPictureTrait;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Vich\UploaderBundle\Mapping\Annotation as Vich;

/**
 * @ORM\Entity(repositoryClass="AmzsCMS\GalleryBundle\Repository\PictureRepository")
 * @ORM\Table(name="amzs_picture")
 * @ORM\HasLifecycleCallbacks
 */
class Picture
{
    use DoctrineIdentifierTrait, DoctrinePropPictureTrait,DoctrineDescriptionTrait,Timestampable;

    /**
     * @ORM\ManyToOne(targetEntity="AmzsCMS\GalleryBundle\Entity\Gallery", inversedBy="picturies")
     * @ORM\JoinColumn(name="gallery_id", referencedColumnName="id", nullable=true)
     */
    private $gallery;

    /**
     * @ORM\OneToMany(targetEntity="AmzsCMS\GalleryBundle\Entity\GalleryPictures", mappedBy="picture")
     */
    private $galleryPictures;

    /**
     * @Vich\UploadableField(mapping="pictures", fileNameProperty="fileName", size="fileSize", mimeType="mimeType", originalName="originalName")
     */
    private $file = null;

    /**
     * @ORM\Column(type="string", nullable="true")
     */
    private $fileName = null;

    /**
     * @ORM\Column(type="string", nullable="true")
     */
    private $originalName = null;

    /**
     * @ORM\Column(type="string", nullable="true")
     */
    private $fileSize = null;

    /**
     * @ORM\Column(type="string", nullable="true")
     */
    private $mimeType = null;

    public function __construct()
    {
        $this->galleryPictures = new ArrayCollection();
    }

    public function setFile($file = null)
    {
        $this->file = $file;

        if ($file) {
            // It is required that at least one field changes if you are using doctrine
            // otherwise the event listeners won't be called and the file is lost
            $this->createdAt = new \DateTimeImmutable();
        }

        return $this;
    }

    public function getFile()
    {
        return $this->file;
    }

    public function getGallery(): ?Gallery
    {
        return $this->gallery;
    }

    public function setGallery(?Gallery $gallery)
    {
        $this->gallery = $gallery;

        return $this;
    }

    /**
     * @return Collection<int, GalleryPictures>
     */
    public function getGalleryPictures(): Collection
    {
        return $this->galleryPictures;
    }

    public function addGalleryPicture(GalleryPictures $galleryPicture)
    {
        if (!$this->galleryPictures->contains($galleryPicture)) {
            $this->galleryPictures->add($galleryPicture);
            $galleryPicture->setPicture($this);
        }

        return $this;
    }

    public function removeGalleryPicture(GalleryPictures $galleryPicture)
    {
        if ($this->galleryPictures->removeElement($galleryPicture)) {
            // set the owning side to null (unless already changed)
            if ($galleryPicture->getPicture() === $this) {
                $galleryPicture->setPicture(null);
            }
        }

        return $this;
    }

    public function getFileName(): ?string
    {
        return $this->fileName;
    }

    public function setFileName(?string $fileName): self
    {
        $this->fileName = $fileName;
        $this->image = $fileName;

        return $this;
    }

    public function getOriginalName(): ?string
    {
        return $this->originalName;
    }

    public function setOriginalName(?string $originalName): self
    {
        $this->originalName = $originalName;
        $this->name = $originalName;

        return $this;
    }

    public function getFileSize(): ?string
    {
        return $this->fileSize;
    }

    public function setFileSize(?string $fileSize): self
    {
        $this->fileSize = $fileSize;

        return $this;
    }

    public function getMimeType(): ?string
    {
        return $this->mimeType;
    }

    public function setMimeType(?string $mimeType): self
    {
        $this->mimeType = $mimeType;

        return $this;
    }
}