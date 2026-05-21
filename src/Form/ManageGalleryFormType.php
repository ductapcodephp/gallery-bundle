<?php

namespace AmzsCMS\GalleryBundle\Form;

use AmzsCMS\CoreBundle\Traits\Form\FormButtonsTrait;
use AmzsCMS\GalleryBundle\Entity\Gallery;
use Doctrine\ORM\EntityRepository;
use Symfony\Bridge\Doctrine\Form\Type\EntityType;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;
use Symfony\Component\Validator\Constraints\NotBlank;

class ManageGalleryFormType extends AbstractType
{
    use FormButtonsTrait;

    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder->add('name', TextType::class, [
            'label' => 'Name',
            'attr' => [
                'class' => 'form-control fs-7',
            ],
            'row_attr' => [
                'class' => 'mb-5',
            ],
            'required' => true,
            'constraints' => [
                new NotBlank(),
            ],
        ]);

        $gallery = $options['data'];
        $this->addActionButtons($builder, [
            'submit_label' => $gallery instanceof Gallery && !is_null($gallery->getId()) ? 'Edit' : "Add",
            // Bạn có thể tùy chỉnh thêm nếu muốn:
            // 'cancel_label' => 'Quay lại',
            // 'container_class' => 'd-flex gap-2 justify-content-end'
        ]);
    }
    public function configureOptions(OptionsResolver $resolver)
    {
        $resolver->setDefaults([
            'data_class' => Gallery::class,
        ]);
    }

}